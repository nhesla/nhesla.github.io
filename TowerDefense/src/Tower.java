import java.awt.*; 
import java.applet.Applet;  
import java.util.Random;

public class Tower extends Thing
{
	protected int damage;
	protected int range; 
	protected int rate;
	protected int boostedD;
	protected int boostedR;
	protected int boostedT;
	protected int reload;
	protected int target;
	protected int targetX;
	protected int targetY;
	protected int angle;

	public Tower(int x, int y, int d)
	{	
		super(x, y, d);
		
		damage = 1;
		range = 1;
		rate = 1;
		boostedD = 0;
		boostedR = 0;
		boostedT = 0;
		reload = 0;
		target = -1;
		targetX = 25/diviser;
		targetY = 350/diviser;
	}
	public Tower(Tower copy, int d)
	{
		super(copy.getX(), copy.getY(), d);
		
		damage = copy.getDamage();
		range = copy.getRange();
		rate = copy.getRate();
		boostedD = copy.getBoostedD();
		boostedR = copy.getBoostedR();
		boostedT = copy.getBoostedT();
		reload = copy.getReload();
		target = copy.getTarget();
		targetX = copy.getTargetX();
		targetY = copy.getTargetY();
		angle = copy.getAngle();
	}
	
	public int getDamage()
	{
		return damage;
	}
	public int getRange()
	{
		return range;
	}
	public int getRate()
	{
		return rate;
	}
	public int getBoostedD()
	{
		return boostedD;
	}
	public int getBoostedR()
	{
		return boostedR;
	}
	public int getBoostedT()
	{
		return boostedT;
	}
	public int getReload()
	{
		return reload;
	}
	public int getTarget()
	{
		return target;
	}
	public int getTargetX()
	{
		return targetX;
	}
	public int getTargetY()
	{
		return targetY;
	}
	public int getAngle()
	{
		return angle;
	}
	public void resetReload()
	{
		reload = 0;
	}
	
	public int getDamage(int n)
	{
		return damage;
	}
	public int getRange(int n)
	{
		return range;
	}
	public int getRate(int n)
	{
		return rate;
	}
	
	public int getUpD()
	{
		int num=0;
		
		if(damage < 5)
			for(int count=0; count < damage; count ++)
			{
				num += count+1;
			}
		
		return num;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 5)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 5)
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num;
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
		
		return num;
	}
	
	public void upgradeDamage()
	{
		if(damage < 5)
			damage ++;
	}
	public void upgradeRange()
	{
		if(range < 5)
			range ++;
	}
	public void upgradeRate()
	{
		if(rate < 5)
			rate ++;
	}
	
	public void setBoostedD(int n)
	{
		boostedD = n;
	}
	public void setBoostedR(int n)
	{
		boostedR = n;
	}
	public void setBoostedT(int n)
	{
		boostedT = n;
	}
	
	public void Reload()
	{
		if(reload > 0)
			reload --;
	}
	
	public void Attack(Creep[] creep, int enemies)
	{
	}
	
	public void drawTower(Graphics g)
	{
		if(reload >= getRate(0)-3)
		{
			g.setColor(Color.white);
			g.drawLine(getX(), getY(), targetX, targetY);
		}
	}
}