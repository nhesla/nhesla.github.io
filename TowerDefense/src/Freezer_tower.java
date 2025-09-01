import java.awt.*;  

 
public class Freezer_tower extends Tower
{
	public Freezer_tower(int x, int y, int d)
	{
		super(x,y,d);
	}
	public Freezer_tower(Tower copy, int d)
	{
		super(copy,d);
	}
	
	public int getDamage(int boost)
	{
		switch(damage+boost)
		{
			case 1:
				return 20;
			case 2:
				return 40;
			case 3:
				return 60;
			case 4:
				return 80;
			case 5:
				return 100;
			case 6:
				return 120;
			case 7:
				return 140;
			case 8:
				return 160;
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
				return 30;
			case 2:
				return 27;
			case 3:
				return 24;
			case 4:
				return 21;
			case 5:
				return 18;
			case 6:
				return 15;
			case 7:
				return 12;
			case 8:
				return 9;		
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
		
		return num*200;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 5)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num*200;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 5)
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num*200;
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
		
		return num*200/3;
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
			    	creep[count].freeze(getDamage(boostedD));
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
	   	//Freezer crystal
	   	
	   	Polygon part1 = new Polygon();
	   	part1.addPoint(getX()-(5/diviser),getY()+(15/diviser));
	   	part1.addPoint(getX()-(3/diviser),getY()+(7/diviser));
	   	part1.addPoint(getX()+(3/diviser),getY()+(7/diviser));
	   	part1.addPoint(getX()+(5/diviser),getY()+(15/diviser));
	   	part1.addPoint(getX()+(15/diviser),getY()+(5/diviser));
	   	part1.addPoint(getX()+(7/diviser),getY()+(3/diviser));
	   	part1.addPoint(getX()+(7/diviser),getY()-(3/diviser));
	   	part1.addPoint(getX()+(15/diviser),getY()-(5/diviser));
	   	part1.addPoint(getX()+(5/diviser),getY()-(15/diviser));
	   	part1.addPoint(getX()+(3/diviser),getY()-(7/diviser));
	   	part1.addPoint(getX()-(3/diviser),getY()-(7/diviser));
	   	part1.addPoint(getX()-(5/diviser),getY()-(15/diviser));
	   	part1.addPoint(getX()-(15/diviser),getY()-(5/diviser));
	   	part1.addPoint(getX()-(7/diviser),getY()-(3/diviser));
	   	part1.addPoint(getX()-(7/diviser),getY()+(3/diviser));
	   	part1.addPoint(getX()-(15/diviser),getY()+(5/diviser));
	   	part1.addPoint(getX()-(5/diviser),getY()+(15/diviser));
	   	
	   	Polygon part2 = new Polygon();
	   	part2.addPoint(getX()-(5/diviser),getY()+(15/diviser));
	   	part2.addPoint(getX()+(5/diviser),getY()+(15/diviser));
	   	part2.addPoint(getX()+(3/diviser),getY()+(7/diviser));
	   	part2.addPoint(getX()+(5/diviser),getY()+(3/diviser));
	   	part2.addPoint(getX()+(15/diviser),getY()+(5/diviser));
	   	part2.addPoint(getX()+(15/diviser),getY()-(5/diviser));
	   	part2.addPoint(getX()+(7/diviser),getY()-(3/diviser));
	   	part2.addPoint(getX()+(3/diviser),getY()-(7/diviser));
	   	part2.addPoint(getX()+(5/diviser),getY()-(15/diviser));
	   	part2.addPoint(getX()-(5/diviser),getY()-(15/diviser));
	   	part2.addPoint(getX()-(3/diviser),getY()-(7/diviser));
	   	part2.addPoint(getX()-(7/diviser),getY()-(3/diviser));
	   	part2.addPoint(getX()-(15/diviser),getY()-(5/diviser));
	   	part2.addPoint(getX()-(15/diviser),getY()+(5/diviser));
	   	part2.addPoint(getX()-(7/diviser),getY()+(3/diviser));
	   	part2.addPoint(getX()-(3/diviser),getY()+(7/diviser));
	   	part2.addPoint(getX()-(5/diviser),getY()+(15/diviser));
	   	
	   	g.setColor(Color.cyan);
		g.fillPolygon(part1);
		g.fillPolygon(part2);
		g.setColor(Color.white);
		g.drawPolygon(part1);
		g.drawPolygon(part2);
		
		/////////frost attack////////
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

			g.setColor(Color.cyan);

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
