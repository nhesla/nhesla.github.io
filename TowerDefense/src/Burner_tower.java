import java.awt.*;   
 
public class Burner_tower extends Tower
{
	public Burner_tower(int x, int y, int d)
	{
		super(x,y,d);
	}
	public Burner_tower(Tower copy, int d)
	{
		super(copy,d);
	}
	
	public int getDamage(int boost)
	{
		switch(damage+boost)
		{
			case 1:
				return 5;
			case 2:
				return 10;
			case 3:
				return 15;
			case 4:
				return 20;
			case 5:
				return 25;
			case 6:
				return 30;
			case 7:
				return 35;
			case 8:
				return 40;
		}
		return 0;
	}
	
	public int getRange(int boost)
	{
		switch(range+boost)
		{
			case 1:
				return 200;
			case 2:
				return 250;
			case 3:
				return 300;
			case 4:
				return 350;
			case 5:
				return 400;
			case 6:
				return 450;
			case 7:
				return 500;
			case 8:
				return 550;
		}
		return 0;
	}
	
	public int getRate(int boost)
	{
		switch(rate+boost)
		{
			case 1:
				return 8;
			case 2:
				return 7;
			case 3:
				return 6;
			case 4:
				return 5;
			case 5:
				return 4;
			case 6:
				return 3;
			case 7:
				return 2;
			case 8:
				return 1;		
		}
		return 0;
	}
	
	public int getUpD()
	{
		int num=0;
		
		if(damage < 5)
			for(int count=0; count < damage; count ++)
			{
				num += count+1;
			}
		
		return num*500;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 5)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num*500;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 5)
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num*500;
	}
	
	public int getUpS()
	{
		int num=0;
		
		for(int count=0; count < rate; count ++)
		{
			num += count+1;
		}
		for(int count=0; count < range; count ++)
		{
			num += count+1;
		}
		for(int count=0; count < rate; count ++) 
		{
			num += count+1;
		} 
		
		return num*500/3;
	}
	
	public void Attack(Creep[] creep, int enemies)
	{
		for(int count=0; count < enemies; count ++)
		{
			if(creep[count].getV() && creep[count].getH() > 0)
			{
				double a = creep[count].getX()-getX();
			    double b = creep[count].getY()-getY();
			    double c = Math.hypot(a,b);
			    	
			    if(c <= (getRange(boostedR)/2)/diviser && reload == 0)
			    {
			    	reload += getRate(boostedT);
			    	target = count;
			    	creep[count].burn(getDamage(boostedD));
			    }
			    
			    if(c <= (getRange(boostedR)/2)/diviser && count == target)
			    {
			    	targetX = creep[count].getX();
			    	targetY = creep[count].getY();
			    }
			}
		}
		
		if(reload > 0)
			reload --;
		else
			target = -1;
	}
	
	public void drawTower(Graphics g)
	{
	   	///Burner turret///
	   	double b = getX()-targetX;
		double a = getY()-targetY;
		double c = Math.hypot(a,b);
	        	
	   	Polygon part1 = new Polygon();
      	part1.addPoint((int)((getX()+(0/diviser)*-b/c)-(25/diviser)*a/c),(int)((getY()-(25/diviser)*-b/c)-(0/diviser)*a/c));
       	part1.addPoint((int)((getX()+(0/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(0/diviser)*a/c));
       	part1.addPoint((int)((getX()-(25/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)+(25/diviser)*a/c));
       	part1.addPoint((int)((getX()-(25/diviser)*-b/c)-(25/diviser)*a/c),(int)((getY()-(25/diviser)*-b/c)+(25/diviser)*a/c));
       	part1.addPoint((int)((getX()+(0/diviser)*-b/c)-(25/diviser)*a/c),(int)((getY()-(25/diviser)*-b/c)-(0/diviser)*a/c));
       	
       	Polygon part2 = new Polygon();
      	part2.addPoint((int)((getX()+(0/diviser)*-b/c)+(25/diviser)*a/c),(int)((getY()+(25/diviser)*-b/c)-(0/diviser)*a/c));
       	part2.addPoint((int)((getX()+(0/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(0/diviser)*a/c));
       	part2.addPoint((int)((getX()-(25/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)+(25/diviser)*a/c));
       	part2.addPoint((int)((getX()-(25/diviser)*-b/c)+(25/diviser)*a/c),(int)((getY()+(25/diviser)*-b/c)+(25/diviser)*a/c));
       	part2.addPoint((int)((getX()+(0/diviser)*-b/c)+(25/diviser)*a/c),(int)((getY()+(25/diviser)*-b/c)-(0/diviser)*a/c));
       	
       	Polygon part3 = new Polygon();
      	part3.addPoint((int)((getX()+(40/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(40/diviser)*a/c));
       	part3.addPoint((int)((getX()+(40/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(40/diviser)*a/c));
       	part3.addPoint((int)((getX()+(15/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(15/diviser)*a/c));
       	part3.addPoint((int)((getX()+(0/diviser)*-b/c)+(20/diviser)*a/c),(int)((getY()+(20/diviser)*-b/c)-(0/diviser)*a/c));
       	part3.addPoint((int)((getX()+(0/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(0/diviser)*a/c));
       	part3.addPoint((int)((getX()+(10/diviser)*-b/c)+(0/diviser)*a/c),(int)((getY()+(0/diviser)*-b/c)-(10/diviser)*a/c));
       	part3.addPoint((int)((getX()+(0/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(0/diviser)*a/c));
       	part3.addPoint((int)((getX()+(0/diviser)*-b/c)-(20/diviser)*a/c),(int)((getY()-(20/diviser)*-b/c)-(0/diviser)*a/c));
       	part3.addPoint((int)((getX()+(15/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(15/diviser)*a/c));
       	part3.addPoint((int)((getX()+(40/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(40/diviser)*a/c));
       	
       	g.setColor(Color.orange);
		g.fillPolygon(part1);
		g.setColor(Color.white);
		g.drawPolygon(part1);
		
		g.setColor(Color.orange);
		g.fillPolygon(part2);
		g.setColor(Color.white);
		g.drawPolygon(part2);
		
		g.setColor(Color.gray);
		g.fillPolygon(part3);
		g.setColor(Color.white);
		g.drawPolygon(part3);
		
		////////flame thrower/////
		if(reload >= getRate(0)-3)
       	{
	       	double dx = targetX - getX();
			double dy = targetY - getY();
			double angleRad = Math.atan2(dy, dx);

			int angleDeg = (int) Math.toDegrees(angleRad);
			if (angleDeg < 0) angleDeg += 360;

			// Convert to Java's clockwise coordinate system
			int javaAngle = (360 - angleDeg) % 360;

			int arcAngle = 30;

			// We want the **end** of the arc to align with the target
			int startAngle = (javaAngle - arcAngle + 360) % 360;

			g.setColor(Color.orange);

			double distance = Math.hypot(dx, dy);
			g.fillArc(
				(int)(getX() - distance),
				(int)(getY() - distance),
				(int)(2 * distance),
				(int)(2 * distance),
				startAngle,
				arcAngle
			);
		}
	}
}
